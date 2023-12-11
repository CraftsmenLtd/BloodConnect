FROM debian:latest

RUN apt update
RUN apt install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install -y make zip unzip wget ca-certificates nodejs python3-sphinx graphviz --no-install-recommends

# Terraform
ENV TERRAFORM_VERSION=1.6.5
RUN wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -P /tmp/
RUN unzip /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /usr/bin

# Node
RUN find . -type f -name package.json -exec bash -c 'npm i --cwd $(dirname {})' \;
