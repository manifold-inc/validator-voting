#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set the path to your Python script
SCRIPT_PATH="$SCRIPT_DIR/onChain.py"

# Set the path for the log file
LOG_PATH="$SCRIPT_DIR/onChain_cron.log"

# Set the path to requirements.txt
REQUIREMENTS_PATH="$SCRIPT_DIR/requirements.txt"

# Set the path for the virtual environment
VENV_PATH="$SCRIPT_DIR/venv"

# Check if the Python script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: Python script not found at $SCRIPT_PATH"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "$REQUIREMENTS_PATH" ]; then
    echo "Error: requirements.txt not found at $REQUIREMENTS_PATH"
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
if python3 -m venv "$VENV_PATH"; then
    echo "Virtual environment created successfully."
else
    echo "Error: Failed to create virtual environment."
    exit 1
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Install requirements
echo "Installing requirements..."
if python -m pip install -r "$REQUIREMENTS_PATH"; then
    echo "Requirements installed successfully."
else
    echo "Error: Failed to install requirements."
    exit 1
fi

# Make sure the Python script is executable
chmod +x "$SCRIPT_PATH"

# Create a temporary file for the new crontab
temp_cron=$(mktemp)

# Write out the current crontab
crontab -l > "$temp_cron" 2>/dev/null

# Append the new cron job to the temporary file
echo "*/72 * * * * $VENV_PATH/bin/python $SCRIPT_PATH >> $LOG_PATH 2>&1" >> "$temp_cron"

# Install the new crontab
if crontab "$temp_cron"; then
    echo "Cron job has been set up to run every 72 minutes."
    echo "Logs will be written to $LOG_PATH"
else
    echo "Error: Failed to install new crontab"
    exit 1
fi

# Remove the temporary file
rm "$temp_cron"

# Deactivate virtual environment
deactivate

echo "Setup complete!"