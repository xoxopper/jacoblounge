FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy_common.conf /etc/nginx/proxy_common.conf
COPY sites-enabled/ /etc/nginx/conf.d/
COPY ssl/ /etc/nginx/ssl/
