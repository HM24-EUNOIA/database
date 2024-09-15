{
  description = "Node.js 22 flake with pnpm";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    defang.url = "github:DefangLabs/defang";
    defang.inputs.nixpkgs.follows = "nixpkgs";
    defang.inputs.flake-utils.follows = "flake-utils";
  };

  outputs = inputs@
    {
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        defang = inputs.defang.packages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs-slim_22
            pnpm
            defang.defang-cli # defang-bin is broken, it doesn't have execute permissions (bad tarball?)
          ];
        };
      }
    );
}
