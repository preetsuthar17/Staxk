import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  account,
  accountRelations,
  passkey,
  passkeyRelations,
  session,
  sessionRelations,
  twoFactor,
  twoFactorRelations,
  user,
  userRelations,
  verification,
} from "./schema/auth";
import { issue, issueRelations } from "./schema/issue";
import {
  project,
  projectRelations,
  projectTeam,
  projectTeamRelations,
} from "./schema/project";
import {
  team,
  teamMember,
  teamMemberRelations,
  teamRelations,
} from "./schema/team";
import {
  workspace,
  workspaceInvitation,
  workspaceInvitationRelations,
  workspaceMember,
  workspaceMemberRelations,
  workspaceRelations,
} from "./schema/workspace";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle({
  client: pool,
  schema: {
    account,
    accountRelations,
    passkey,
    passkeyRelations,
    session,
    sessionRelations,
    twoFactor,
    twoFactorRelations,
    user,
    userRelations,
    verification,
    workspace,
    workspaceInvitation,
    workspaceInvitationRelations,
    workspaceMember,
    workspaceRelations,
    workspaceMemberRelations,
    team,
    teamMember,
    teamRelations,
    teamMemberRelations,
    project,
    projectTeam,
    projectRelations,
    projectTeamRelations,
    issue,
    issueRelations,
  },
});
