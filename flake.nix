{
  description = "A Nix devShell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = {nixpkgs, ...}: let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
  in {
    devShells.${system}.default = pkgs.mkShell {
      packages = with pkgs; [
        git
        gnumake

        docker
        docker-compose
        docker-buildx

        bun
        biome

        # LSPs
        dockerfile-language-server
        docker-compose-language-service
        typescript-language-server
      ];

      shellHook = ''
        echo Welcome to devShell!
      '';
    };
  };
}

