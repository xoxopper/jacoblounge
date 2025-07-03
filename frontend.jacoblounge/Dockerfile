# Use the official Golang image
FROM golang:1.21-alpine

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Build the Go app
RUN go mod init frontend.jacoblounge
RUN go mod tidy
RUN go build -o server

# Expose port
EXPOSE 80

# Run the app
CMD ["./server"]

