# base node image
FROM node:24-alpine AS base

WORKDIR /ctcadmin

# Install openssl for Prisma and git
RUN apk update && apk add openssl git nano

ENV NODE_ENV=production

# enable corepack for yarn
RUN corepack enable

# add the user and group we'll need in our final image
RUN addgroup --system --gid 568 apps
RUN adduser --system --uid 568 apps

COPY package.json yarn.lock .yarnrc.yml ./

# Install all node_modules, including dev dependencies
FROM base AS deps

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --immutable

# Setup production node_modules
FROM base AS prod-deps

RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn workspaces focus --production

# Build the app
FROM base AS build

COPY --from=deps /ctcadmin /ctcadmin
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn prisma generate

# App source
COPY . .
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn build

# Finally, build the production image with minimal footprint
FROM base AS final

WORKDIR /ctcadmin

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_OPTIONS="--enable-source-maps --max-old-space-size=512"

# Copy runtime deps
COPY --from=prod-deps /ctcadmin /ctcadmin

# Copy build output
COPY --from=build /ctcadmin/build ./build
COPY --from=build /ctcadmin/public ./public
COPY --from=build /ctcadmin/prisma ./prisma

USER apps

EXPOSE 3000

CMD ["node", "build/server/index.js"]
