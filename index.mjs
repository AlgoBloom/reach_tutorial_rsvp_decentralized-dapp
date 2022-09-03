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
  // destructuring acc from obj
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

// Event.Host value is defined uding the stdPerson function
const Host = stdPerson({
  acc: accHost,
  label: hostLabel,
});

// define deadline based on the current time
const deadline = (await stdlib.getNetworkTime()).add(timeLimit);
// function to wait until the deadline passes
const waitUntilDeadline = async () => {
  console.log(`Waiting until ${deadline}`);
  await stdlib.waitUntilTime(deadline);
};

// defining the details of the reservation as a object
const details = {
  name, reservation, deadline, host: accHost,
};

// Event.makeGuest function creates a test account and sets a label
const makeGuest = async (label) => {
  // starts a new account and initializes a starting balance
  const acc = await stdlib.newTestAccount(sbal);
  // sets a label for debugging
  acc.setDebugLabel(label);

  
  let ctcInfo = undefined;
  // function spawns a new contract that runs the guest participant
  const willGo = async () => {
    const ctcGuest = acc.contract(backend);
    // contract information is returned by the disconnect
    // ctcInfo is the actual contract that was deployed
    // in real deployment this contract information would be presented to the user as something like a QR code for them to save and show to the host later 
    ctcInfo = await stdlib.withDisconnect(() => ctcGuest.p.Guest({
      details,
      registered: stdlib.disconnect,
    }));
    console.log(`${label} made reservation: ${ctcInfo}`);
  };

  // define two functions Guest.showUp and Guest.noShow
  // be defining doHost as a common function
  // this function accepts a boolean
  const doHost = async (showed) => {
    // throws an error if no reservation was made
    // know this because ctcInfo var is undefined
    if ( ctcInfo === undefined ) {
      throw new Error('no reservation');
    }
    console.log(`Checking in ${label} to ${ctcInfo}...`);
    // uses host's account abstraction to attach to an instance of the program
    // has access to details object, so can ensure that they match
    const ctcHost = accHost.contract(backend, ctcInfo);
    await ctcHost.p.Host({
      details, showed
    });
    console.log(`${label} did${showed ? '' : ' not'} show.`);
  };
  const showUp = () => doHost(true);
  const noShow = () => doHost(false);

  // close definition of guest abstraction calling stdPerson
  // to add the Person.getBalance function
  return stdPerson({
    acc, label,
    willGo, showUp, noShow,
  });
};
// Event.makeGuests which creates a single promise
// out of the array of promises of guest abstractions
// these values are all wrapped into a final object
// this is the result of makeGuests
const makeGuests = (labels) => Promise.all(labels.map(makeGuest));

return { Host, makeGuest, makeGuests, waitUntilDeadline };
};