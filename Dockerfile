# Stage: yarn install
FROM node:22-bullseye-slim AS yarn
LABEL description="Setting yarn"

WORKDIR /usr/app
ENTRYPOINT ["yarn"]

# Stage: yarn-build and migration
FROM yarn AS yarn-build
LABEL description="Building for production"
WORKDIR /tmp/app
COPY ["package*.json", "./"]
COPY ["yarn.lock", "./"]
RUN yarn install

COPY [".", "./"]

# Change to not use the env-example file
RUN rm -rf .env && cp env-example .env 

# Run Migrations and Seed
RUN yarn migration:run
RUN yarn seed:run

RUN yarn build

# Stage: release-app
FROM node:22-bullseye-slim AS release
LABEL description="Picking only necessary modules to run app"
WORKDIR /usr/app
COPY --from=yarn-build ["/tmp/app/package.json", "./package.json"]
COPY --from=yarn-build ["/tmp/app/yarn.lock", "./yarn.lock"]

RUN yarn install --production

COPY --from=yarn-build ["/tmp/app/wait-for-it.sh", \
    "/tmp/app/startup.sh", \
    "/opt/"]
COPY --from=yarn-build ["/tmp/app/dist", "./"]

CMD ["/bin/bash", "/opt/startup.sh"]