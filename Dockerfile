#checkov:skip=CKV_DOCKER_2: "Ensure that HEALTHCHECK instructions have been added to container images"
#checkov:skip=CKV_DOCKER_3: "Ensure that a user for the container has been created"
FROM --platform=linux/amd64 debian:bookworm-slim

# Common tools
#checkov:skip=CKV_DOCKER_9: "Ensure that APT isn't used"
RUN apt update && apt install -y ca-certificates curl gnupg make gcc zip unzip apt-utils apt-transport-https software-properties-common \
    python3 python3-pip python3-dev \
    python3-sphinx graphviz \
    git \
    --no-install-recommends

COPY docs/requirements.txt /tmp
RUN pip3 install -r /tmp/requirements.txt --break-system-packages && \
    pip3 install terraform-local checkov==3.1.40 --break-system-packages && \
    rm /tmp/requirements.txt

# Install Binary tools
RUN curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscliv2.zip && \
    unzip /tmp/awscliv2.zip -d /tmp && \
    /tmp/aws/install && \
    rm -rf /tmp/aws /tmp/awscliv2.zip && \
    curl https://releases.hashicorp.com/terraform/1.10.4/terraform_1.10.4_linux_amd64.zip -o /tmp/terraform_1.10.4_linux_amd64.zip  && \
    unzip /tmp/terraform_1.10.4_linux_amd64.zip -d /usr/bin && \
    rm /tmp/terraform_1.10.4_linux_amd64.zip && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt update && apt install -y nodejs --no-install-recommends

# Install API tools
RUN npm install -g @stoplight/spectral-cli @redocly/cli@latest
