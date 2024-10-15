FROM nginx:1.27.1-alpine

RUN apk update && apk add python3 py3-pip jq unzip less
RUN pip3 install awscli awscli-local --break-system-packages

COPY ./ /usr/share/nginx/html/openapi
COPY ./swagger-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./swagger-ui/process-openapi.sh /process-openapi.sh
COPY ./swagger-ui/generate-token.sh /generate-token.sh
COPY ./swagger-ui/index.html /usr/share/nginx/html/index.html
