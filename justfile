# List all available commands
default:
    @just --list

# Install dependencies and set up the database
setup:
    bun install
    bun db:push

# Run the development server
dev:
    bun dev

# Build the application for production
build:
    bun run build

# Build and run the Docker container for the stake updater
docker-start:
    docker build -t stake-updater ./stake_updater
    docker run -d --name stake-updater-container stake-updater

# Stop and remove the Docker container
docker-stop:
    docker stop stake-updater-container
    docker rm stake-updater-container

# Full setup and start: setup, build Docker, run dev server and Docker container
start-all: setup docker-start
    bun dev

# Stop all services and clean up
stop-all: docker-stop
