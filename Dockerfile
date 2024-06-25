# Use the official Node.js image as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the Express server will be listening on
EXPOSE 3000

# Start the Express server
CMD ["node", "index.js"]