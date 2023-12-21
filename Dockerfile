FROM debian:buster-slim

# Common tools
RUN apt update && apt install -y ca-certificates curl gnupg make zip unzip wget apt-utils
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Nodejs
ARG NODE_MAJOR
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt update
RUN apt install -y nodejs --no-install-recommends

# Python
RUN apt install -y build-essential zlib1g-dev libffi-dev libssl-dev --no-install-recommends
RUN cd tmp && wget https://www.python.org/ftp/python/3.11.3/Python-3.11.3.tgz && tar xzf Python-3.11.3.tgz
RUN cd /tmp/Python-3.11.3 && ./configure --enable-optimizations && make install
RUN pip3 install --upgrade pip

# Docs
RUN apt install -y python3-sphinx graphviz --no-install-recommends

# Terraform
ARG TERRAFORM_VERSION
RUN wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -P /tmp/
RUN unzip /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /usr/bin

# Security
ARG CHECKOV_VERSION
RUN pip3 install checkov==${CHECKOV_VERSION}
