FROM debian:buster-slim

# Common tools
RUN apt update && apt install -y ca-certificates curl gnupg make zip unzip wget apt-utils  \
    python3-sphinx graphviz \
    --no-install-recommends

# Nodejs
ARG NODE_MAJOR
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt update
RUN apt install -y nodejs --no-install-recommends

# Terraform
ARG TERRAFORM_VERSION
RUN wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -P /tmp/
RUN unzip /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /usr/bin
RUN rm /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip
