# base node image
FROM node:20-alpine as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

# enable corepack for yarn
RUN corepack enable

# Install openssl for Prisma and git
RUN apk update && apk add openssl && apk add git

WORKDIR /ctcadmin

ADD package.json .
ADD yarn.lock .
ADD .yarnrc.yml .

RUN yarn set version stable


# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /ctcadmin

RUN yarn install

# Setup production node_modules
FROM base as production-deps

WORKDIR /ctcadmin

RUN yarn workspaces focus --production

# Build the app
FROM base as build

WORKDIR /ctcadmin

COPY --from=deps /ctcadmin/node_modules /ctcadmin/node_modules
COPY --from=deps /ctcadmin/yarn.lock /ctcadmin/yarn.lock

ADD prisma prisma

RUN yarn prisma generate

ADD . .

RUN yarn build

# Finally, build the production image with minimal footprint
FROM base

WORKDIR /ctcadmin

ENV REMIX_DEV_ORIGIN="http://0.0.0.0:3000"

COPY --from=production-deps /ctcadmin/node_modules /ctcadmin/node_modules
COPY --from=build /ctcadmin/node_modules/.prisma /ctcadmin/node_modules/.prisma

COPY --from=build /ctcadmin/build /ctcadmin/build
COPY --from=build /ctcadmin/public /ctcadmin/public

COPY --from=deps /ctcadmin/yarn.lock /ctcadmin/yarn.lock

EXPOSE 3000

CMD ["yarn", "start"]