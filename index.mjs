// import and initialize the Reach standard library
import { loadStdlib, test } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
// Basics
const stdlib = loadStdlib();
const err = {
  // different error messages for different connectors
  'ETH': 'transaction may fail',
  'ALGO': 'assert failed',
  'CFX': 'transaction is reverted',
}[stdlib.connector];

// defining the make RSVP function
const makeRSVP = async ({ hostLabel, name, reservation, timeLimit }) => {
  const sbal = stdlib.parseCurrency(100);
  // create a new host account and fund the account
  const accHost = await stdlib.newTestAccount(sbal);
  // setting a label for debugging purposes
  accHost.setDebugLabel(hostLabel);

// this function takes an object with an account field
// adds a Person.getBalance function
// returns the account's current balance as a formatted string
const stdPerson = (obj) => {
  const { acc } = obj;
  const getBalance = async () => {
    const bal = await acc.balanceOf();
    return `${stdlib.formatCurrency(bal, 4)} ${stdlib.standardUnit}`;
  };
  return {
    ...obj,
    getBalance,
  };
};

const Host = stdPerson({
  acc: accHost,
  label: hostLabel,
});