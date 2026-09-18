-- Adds an admin-review step between an org submitting a request and a
-- volunteer being matched to it: pending -> approved/rejected -> accepted
-- -> in_transit -> delivered. 'pending' keeps its existing meaning
-- (submitted, awaiting admin review); 'approved' is new and marks a request
-- as reviewed and available for matching; 'rejected' is a new terminal state
-- for requests the admin declines.

alter table items drop constraint items_status_check;

alter table items add constraint items_status_check
  check (status in ('pending', 'approved', 'rejected', 'accepted', 'in_transit', 'delivered'));
