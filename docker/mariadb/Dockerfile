FROM mariadb:11.4

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /etc/mysql/certs /var/log/mysql \
 && openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
      -keyout /etc/mysql/certs/ca-key.pem \
      -out /etc/mysql/certs/ca.pem \
      -subj "/CN=DBMS Classroom Lab CA" \
 && printf "[req]\ndistinguished_name=dn\nreq_extensions=v3_req\nprompt=no\n[dn]\nCN=mariadb\n[v3_req]\nsubjectAltName=DNS:mariadb,DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n" > /tmp/openssl-mariadb.cnf \
 && openssl req -newkey rsa:2048 -nodes \
      -keyout /etc/mysql/certs/server-key.pem \
      -out /tmp/server.csr \
      -config /tmp/openssl-mariadb.cnf \
 && openssl x509 -req -in /tmp/server.csr \
      -CA /etc/mysql/certs/ca.pem \
      -CAkey /etc/mysql/certs/ca-key.pem \
      -CAcreateserial \
      -out /etc/mysql/certs/server-cert.pem \
      -days 3650 \
      -extensions v3_req \
      -extfile /tmp/openssl-mariadb.cnf \
 && rm -f /tmp/server.csr /tmp/openssl-mariadb.cnf /etc/mysql/certs/ca-key.pem /etc/mysql/certs/ca.srl \
 && chown -R mysql:mysql /etc/mysql/certs /var/log/mysql \
 && chmod 755 /var/log/mysql \
 && chmod 644 /etc/mysql/certs/ca.pem /etc/mysql/certs/server-cert.pem \
 && chmod 600 /etc/mysql/certs/server-key.pem

COPY classroom.cnf /etc/mysql/conf.d/classroom.cnf
RUN chmod 644 /etc/mysql/conf.d/classroom.cnf
