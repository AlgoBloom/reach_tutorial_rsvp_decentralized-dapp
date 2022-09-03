'reach 0.1';
'use strict';

// this object holds the details of a RSVP
const Details = Object({
  name: Bytes(128),
  reservation: UInt,
  deadline: UInt,
  host: Address,
});

// this is the application that gets mounted
export const main = Reach.App(() => {
  // host participant is the deployer
  const Host = Participant('Host', {
    details: Details,
    showed: Bool,
  });
  // guest participant is sending the RSVP
  const Guest = Participant('Guest', {
    details: Details,
    registered: Fun([Contract], Null),
  });
  // initialization begins the application
  init();

// guest launches a instance by doing the first publication
Guest.only(() => {
  // declassify the details objext which they are getting from the host participant
  const details = declassify(interact.details);
});
// guest pays the reservation fee
Guest.publish(details).pay(details.reservation);
const { reservation, deadline, host } = details;
// encforcing that the current time on the network is before the deadline
enforce( thisConsensusTime() < deadline, "too late" );
// guest is informed through registered interact function about contract information so they can share with the host
Guest.interact.registered(getContract());
commit();

// host now attaches and declares what should happen to the reservation
Host.only(() => {
  const hdetails = declassify(interact.details);
  // host checks that details are correct
  check( details == hdetails, "wrong event" );
  const showed = declassify(interact.showed);
});
// if details are correct then the host publishes a boolean for whether the guest really showed up or not
Host.publish(showed).check(() => {
  // when host publishes, it is checked locally and consensually whether the sender is the specified host
  check(this == host, "not the host");
});
// ensuring that the time is after the deadline
enforce( thisConsensusTime() >= deadline, "too early" );
// send reservation to appropriate place
transfer(reservation).to(showed ? Guest : Host);
commit();
exit();
});