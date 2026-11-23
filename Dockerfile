# Lightweight Nginx Web Server for Production Container
FROM nginx:alpine

# Copy application files into Nginx default serving root
COPY . /usr/share/nginx/html

# Expose standard web port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
