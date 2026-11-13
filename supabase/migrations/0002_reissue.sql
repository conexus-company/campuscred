-- Re-issue (alvin/15-reissue): a corrected credential links to the one it replaces.
-- Off-chain only: the contract cannot change; on chain the old credential is revoked with reason REPLACED.
alter table credentials add column replaces char(66) references credentials(doc_hash);

-- A credential can be replaced only once.
create unique index credentials_replaces_key on credentials(replaces) where replaces is not null;
