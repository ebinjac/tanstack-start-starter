import type { Team } from "@/db/schema";
import { Card, Table } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { allTeamsQueryOptions } from "../admin";

export const Route = createFileRoute("/admin/teams")({
	component: TeamsView,
});

function TeamsView() {
	const { data: allTeams } = useSuspenseQuery(allTeamsQueryOptions());

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl font-black tracking-tight">All Teams</h1>
				<p className="text-muted text-sm">
					Review existing team registrations.
				</p>
			</div>

			<Card className="overflow-clip border border-border/30 bg-surface">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content aria-label="All Teams">
							<Table.Header>
								<Table.Column>Team Name</Table.Column>
								<Table.Column>User Group</Table.Column>
								<Table.Column>Admin Group</Table.Column>
								<Table.Column>Contact Email</Table.Column>
							</Table.Header>
							<Table.Body
								renderEmptyState={() => (
									<div className="p-4 text-center text-muted">
										No teams registered
									</div>
								)}
							>
								{allTeams.map((t: Team) => (
									<Table.Row key={t.id}>
										<Table.Cell className="font-semibold">
											{t.teamName}
										</Table.Cell>
										<Table.Cell>
											<code>{t.userGroup}</code>
										</Table.Cell>
										<Table.Cell>
											<code>{t.adminGroup}</code>
										</Table.Cell>
										<Table.Cell className="text-muted text-xs">
											{t.contactEmail}
										</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			</Card>
		</div>
	);
}
