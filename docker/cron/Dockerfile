FROM alpine:latest

# Install wget for making HTTP requests
RUN apk add --no-cache wget tzdata

# Set timezone (optional - adjust as needed)
ENV TZ=Asia/Bangkok

# Copy cron scripts
COPY crontab /etc/crontabs/root
COPY sync-financial.sh /usr/local/bin/sync-financial.sh

# Make script executable
RUN chmod +x /usr/local/bin/sync-financial.sh

# Create log file
RUN touch /var/log/cron.log

# Run cron in foreground
CMD crond -f -l 2 && tail -f /var/log/cron.log
