FROM debian:buster-slim

# Common tools
RUN apt update && apt install -y ca-certificates curl gnupg make zip unzip wget apt-utils  \
    build-essential zlib1g-dev libffi-dev libssl-dev libgdbm-dev libc6-dev libbz2-dev \
    python3-sphinx graphviz \
    --no-install-recommends

# Nodejs
ARG NODE_MAJOR
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt update
RUN apt install -y nodejs --no-install-recommends

# Python
ARG PYTHON_VERSION
RUN cd tmp && wget https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz && tar xzf Python-${PYTHON_VERSION}.tgz
RUN cd /tmp/Python-${PYTHON_VERSION} && ./configure --enable-optimizations && make install
RUN rm -R /tmp/Python-${PYTHON_VERSION}
RUN pip3 install --upgrade pip

# Terraform
ARG TERRAFORM_VERSION
RUN wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -P /tmp/
RUN unzip /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /usr/bin
RUN rm /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip

# Security
ARG CHECKOV_VERSION
RUN pip3 install checkov==${CHECKOV_VERSION}
