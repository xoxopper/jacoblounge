# Use the official Golang image
FROM golang:1.24-alpine

# Set working directory
WORKDIR /app

COPY go.mod ./
RUN go mod download

# Copy source code
COPY . .

# Build the Go app
RUN go build -o server

# Expose port
EXPOSE 80

# Run the app
CMD ["./server"]

