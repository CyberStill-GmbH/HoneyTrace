FROM rust:1.85-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --locked --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/target/release/honeytrace-engine /usr/local/bin/honeytrace-engine
ENTRYPOINT ["/usr/local/bin/honeytrace-engine"]
