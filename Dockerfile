FROM nginx:alpine
COPY . /usr/share/nginx/html

# To run the app as a container follow the steps below:
#
# 1) Create the docker image:
#    docker build -t visualizing-git .
#
# 2) Run the container in the port 8080:
#    docker run -d -p 8080:80 visualizing-git
