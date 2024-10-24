#checkov:skip=CKV_DOCKER_2: "Ensure that HEALTHCHECK instructions have been added to container images"
#checkov:skip=CKV_DOCKER_3: "Ensure that a user for the container has been created"
FROM --platform=linux/amd64 debian:bookworm-slim

# Common tools
#checkov:skip=CKV_DOCKER_9: "Ensure that APT isn't used"
RUN apt update && apt install -y ca-certificates curl gnupg make gcc zip unzip apt-utils apt-transport-https software-properties-common procps \
    python3 python3-pip python3-dev \
    python3-sphinx graphviz \
    --no-install-recommends

# AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip" && \
    unzip /tmp/awscliv2.zip -d /tmp && \
    /tmp/aws/install && \
    rm -rf /tmp/aws /tmp/awscliv2.zip

# Python Packages
ARG CHECKOV_VERSION
RUN pip3 install awscli-local terraform-local checkov==${CHECKOV_VERSION} --break-system-packages

# Docs requirements
COPY docs/requirements.txt /tmp
RUN pip3 install -r /tmp/requirements.txt --break-system-packages
RUN rm /tmp/requirements.txt

# Terraform
ARG TERRAFORM_VERSION
RUN curl -o /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
    unzip /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /usr/bin && \
    rm /tmp/terraform_${TERRAFORM_VERSION}_linux_amd64.zip

# Setup Nodejs and Docker Repo
ARG NODE_MAJOR
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Nodejs and Docker
RUN apt update && apt install -y nodejs --no-install-recommends

# Install API tools
RUN npm install -g @stoplight/spectral-cli @redocly/cli@latest
