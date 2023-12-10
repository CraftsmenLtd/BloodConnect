FROM debian:latest

RUN apt-get update
RUN apt-get install -y make zip unzip wget ca-certificates --no-install-recommends

ENV TERRAFORM_VERSION=1.6.5
RUN wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -P /tmp/
RUN unzip /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /usr/bin
