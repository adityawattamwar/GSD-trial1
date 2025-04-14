# Use an official Node.js image as the base image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the backend port
EXPOSE 5000

# Set environment variables (optional, can also be set in docker-compose.yml)
ENV NODE_ENV=production

# Start the backend server
CMD ["npm", "start"]