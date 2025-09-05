#checkov:skip=CKV_DOCKER_2: "Ensure that HEALTHCHECK instructions have been added to container images"
#checkov:skip=CKV_DOCKER_3: "Ensure that a user for the container has been created"
FROM debian:bookworm-slim

#checkov:skip=CKV_DOCKER_9: "Ensure that APT isn't used"
RUN apt update && apt install -y \
    ca-certificates curl openssh-client gnupg make gcc zip unzip apt-utils apt-transport-https software-properties-common sudo \
    python3 python3-pip python3-dev \
    python3-sphinx graphviz \
    git openjdk-17-jdk \
    wget tar lib32stdc++6 lib32z1 libc6-i386 \
    build-essential ninja-build \
    --no-install-recommends && \
    curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscliv2.zip && \
    unzip /tmp/awscliv2.zip -d /tmp && \
    /tmp/aws/install && \
    curl https://releases.hashicorp.com/terraform/1.10.4/terraform_1.10.4_linux_amd64.zip -o /tmp/terraform_1.10.4_linux_amd64.zip && \
    unzip /tmp/terraform_1.10.4_linux_amd64.zip -d /usr/bin && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt update && apt install -y nodejs --no-install-recommends && \
    npm install -g yarn @stoplight/spectral-cli @redocly/cli@latest eas-cli@latest && \
    mkdir -p /opt/android-sdk/cmdline-tools && \
    curl -o /tmp/sdk.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip /tmp/sdk.zip -d /opt/android-sdk/cmdline-tools && \
    mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest && \
    yes | /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses

COPY docs/requirements.txt /tmp
RUN pip3 install -r /tmp/requirements.txt --break-system-packages && \
    pip3 install terraform-local checkov==3.1.40 awscli-local --break-system-packages

RUN rm -r /tmp/* && \
    rm -rf /var/lib/apt/lists/* && \
    apt update

ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd -g ${HOST_GID} bloodconnect && \
    useradd -m -u ${HOST_UID} -g bloodconnect -s /bin/bash bloodconnect && \
    mkdir -p /app && chown bloodconnect:bloodconnect /app && \
    echo "bloodconnect ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    sudo chown -R bloodconnect:bloodconnect /opt/android-sdk


USER bloodconnect
