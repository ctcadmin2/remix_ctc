# base node image
FROM node:22-alpine as base

# Install openssl for Prisma and git
RUN apk update && apk add openssl && apk add git

ENV NODE_ENV=production

WORKDIR /ctcadmin

# enable corepack for yarn
RUN corepack enable
RUN yarn set version stable

# Add base files
ADD package.json .
ADD yarn.lock .
ADD .yarnrc.yml .

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /ctcadmin

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install

# Setup production node_modules
FROM base as production-deps

WORKDIR /ctcadmin

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn workspaces focus --production

# Build the app
FROM base as build

WORKDIR /ctcadmin

COPY --from=deps /ctcadmin/node_modules /ctcadmin/node_modules
COPY --from=deps /ctcadmin/yarn.lock /ctcadmin/yarn.lock

ADD prisma prisma

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn prisma generate

ADD . .

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn build

# Finally, build the production image with minimal footprint
FROM base

WORKDIR /ctcadmin

ENV REMIX_DEV_ORIGIN="http://0.0.0.0:3000"

COPY --from=production-deps /ctcadmin/node_modules /ctcadmin/node_modules
COPY --from=build /ctcadmin/node_modules/.prisma /ctcadmin/node_modules/.prisma

COPY --from=build /ctcadmin/build /ctcadmin/build
COPY --from=build /ctcadmin/public /ctcadmin/public
COPY --from=build /ctcadmin/prisma /ctcadmin/prisma

COPY --from=deps /ctcadmin/yarn.lock /ctcadmin/yarn.lock

EXPOSE 3000

CMD ["yarn", "start"]