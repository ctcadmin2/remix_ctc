# base node image
FROM node:22-alpine AS base

# Install openssl for Prisma and git
RUN apk update && apk add openssl git

ENV NODE_ENV=production
ENV YARN_VERSION=4.5.1

WORKDIR /ctcadmin

# enable corepack for yarn
RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

# add the user and group we'll need in our final image
RUN addgroup --system --gid 568 apps
RUN adduser --system --uid 568 apps

# Add base files
ADD package.json .
ADD yarn.lock .
ADD .yarnrc.yml .

# Install all node_modules, including dev dependencies
FROM base AS deps

WORKDIR /ctcadmin

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install

# Setup production node_modules
FROM base AS production-deps

WORKDIR /ctcadmin

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn workspaces focus --production

# Build the app
FROM base AS build

WORKDIR /ctcadmin

COPY --from=deps /ctcadmin/node_modules /ctcadmin/node_modules
COPY --from=deps /ctcadmin/yarn.lock /ctcadmin/yarn.lock

ADD prisma prisma

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn prisma generate

ADD . .

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn build

# Finally, build the production image with minimal footprint
FROM base AS final

WORKDIR /ctcadmin

ENV REMIX_DEV_ORIGIN="http://0.0.0.0:3000"

COPY --from=production-deps /ctcadmin/.yarn /ctcadmin/.yarn
COPY --from=production-deps /ctcadmin/node_modules /ctcadmin/node_modules
COPY --from=build /ctcadmin/node_modules/.prisma /ctcadmin/node_modules/.prisma

COPY --from=build /ctcadmin/build /ctcadmin/build
COPY --from=build /ctcadmin/public /ctcadmin/public
COPY --from=build /ctcadmin/prisma /ctcadmin/prisma

COPY --from=deps /ctcadmin/yarn.lock /ctcadmin/yarn.lock

USER apps

RUN corepack prepare yarn@${YARN_VERSION}

EXPOSE 3000

CMD ["yarn", "run", "start"]
