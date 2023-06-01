const Migrations = artifacts.require("Migrations");
const OracleGuard = artifacts.require("OracleGuard");
//const OracleHedge = artifacts.require("OracleHedge");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(OracleGuard, 28, 4, 4, 900);
};
