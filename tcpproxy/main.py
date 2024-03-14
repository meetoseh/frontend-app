"""Expo SDK 50+ requires a TLS connection to the Expo development
server, but does not itself provide any mechanism to do this. This
acts as a TLS-terminating proxy for the Expo development server.

You must use a real certificate for this, usually issued to 
oseh-dev.com (a domain we own but do not use publicly). Furthermore, you
must set a custom DNS server on the same wifi network, and proxy
that DNS to this server (on windows this can be done via sudppipe +
ubuntu subsystem + dnsmasq + altering hosts file).
"""

import argparse
import os
import socket
import ssl
import threading
from typing import Any
import select


def main():
    parser = argparse.ArgumentParser(description="TLS-terminating TCP proxy")
    parser.add_argument(
        "-b",
        "--backend",
        type=str,
        help="The backend address of the server to proxy to",
        required=True,
    )
    parser.add_argument(
        "-p",
        "--backend-port",
        type=int,
        help="The backend port of the server to proxy to",
        required=True,
    )
    parser.add_argument(
        "-H", "--host", type=str, help="The host address to listen on", required=True
    )
    parser.add_argument(
        "-P", "--host-port", type=int, help="The host port to listen on", required=True
    )
    parser.add_argument(
        "-c",
        "--certpath",
        type=str,
        help="The path to the certificate file",
        required=True,
    )
    parser.add_argument(
        "-k", "--keypath", type=str, help="The path to the key file", required=True
    )
    args = parser.parse_args()
    th = threading.Thread(
        target=_main,
        args=(
            args.host,
            args.host_port,
            args.backend,
            args.backend_port,
            args.certpath,
            args.keypath,
        ),
    )
    th.start()
    try:
        input("Press enter to stop the server...\n")
    except BaseException:
        ...
    os.kill(os.getpid(), 9)


def _main(
    host_addr: str,
    host_port: int,
    backend_addr: str,
    backend_port: int,
    certpath: str,
    keypath: str,
) -> None:
    print(f"Starting server on {host_addr}:{host_port}...")
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certpath, keypath)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0) as sock:
        sock.bind((host_addr, host_port))
        sock.listen(5)
        with context.wrap_socket(sock, server_side=True) as ssock:
            while True:
                try:
                    conn, addr = ssock.accept()
                    threading.Thread(
                        target=_manage_socket,
                        args=(conn, addr, backend_addr, backend_port),
                    ).start()
                except ssl.SSLError:
                    continue


def _manage_socket(
    sock: socket.socket, addr: Any, backend_addr: str, backend_port: int
) -> None:
    print(
        f"accepting connection from {addr}, forwarding to {backend_addr}:{backend_port}"
    )

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0) as backend_sock:
        backend_sock.connect((backend_addr, backend_port))

        while True:
            rlist, _, _ = select.select([sock, backend_sock], [], [])
            closed = False
            for s in rlist:
                data = s.recv(4096)
                if not data:
                    closed = True
                    break
                if s is sock:
                    backend_sock.sendall(data)
                else:
                    sock.sendall(data)
            if closed:
                break

    print(f"closing connection from {addr}")
    sock.close()
    backend_sock.close()


if __name__ == "__main__":
    main()
