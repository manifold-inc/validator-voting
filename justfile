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
down:
    docker stop stake-updater-container
    docker rm stake-updater-container

# Start docker and dev application
up: docker-start dev

# Full setup and start: setup, build Docker, run dev server and Docker container
start-all: setup docker-start
    bun dev

