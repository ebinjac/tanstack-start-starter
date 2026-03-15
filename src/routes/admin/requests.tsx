import { AlertDialog, Button, Card, Surface, Table, TextArea } from "@heroui/react";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { approveTeamRequestFn, rejectTeamRequestFn } from "@/actions/teams.fn";
import { pendingRequestsQueryOptions } from "../admin";

export const Route = createFileRoute("/admin/requests")({
	loader: ({ context }) => {
		context.queryClient.prefetchQuery(pendingRequestsQueryOptions());
	},
	component: RequestsView,
});

function RequestsView() {
	const queryClient = useQueryClient();
	const { data: pendingRequests } = useSuspenseQuery(
		pendingRequestsQueryOptions(),
	);

	const [actionState, setActionState] = useState<{
		isOpen: boolean;
		type: "approve" | "reject" | null;
		request: any | null;
	}>({ isOpen: false, type: null, request: null });

	const [comment, setComment] = useState("");

	const approveMutation = useMutation<
		{ success: boolean },
		Error,
		{ data: { requestId: string; comments?: string } }
	>({
		mutationFn: approveTeamRequestFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "pendingRequests"] });
			setActionState({ isOpen: false, type: null, request: null });
		},
	});

	const rejectMutation = useMutation<
		{ success: boolean },
		Error,
		{ data: { requestId: string; comments: string } }
	>({
		mutationFn: rejectTeamRequestFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "pendingRequests"] });
			setActionState({ isOpen: false, type: null, request: null });
		},
	});

	const openDialog = (type: "approve" | "reject", request: any) => {
		setActionState({ isOpen: true, type, request });
		setComment("");
	};

	const confirmAction = async () => {
		if (!actionState.request) return;

		if (actionState.type === "approve") {
			await approveMutation.mutateAsync({
				data: {
					requestId: actionState.request.id,
					comments: comment || undefined,
				},
			});
		} else if (actionState.type === "reject") {
			await rejectMutation.mutateAsync({
				data: {
					requestId: actionState.request.id,
					comments: comment,
				},
			});
		}
	};

	const isMutating = approveMutation.isPending || rejectMutation.isPending;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl font-black tracking-tight">Team Requests</h1>
				<p className="text-muted text-sm">
					Review and approve new team registration submissions.
				</p>
			</div>

			<Card className="overflow-clip border border-border/30 bg-surface">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content aria-label="Team Requests">
							<Table.Header>
								<Table.Column>Team Name</Table.Column>
								<Table.Column>User Group</Table.Column>
								<Table.Column>Requested By</Table.Column>
								<Table.Column>Actions</Table.Column>
							</Table.Header>
							<Table.Body
								renderEmptyState={() => (
									<div className="p-4 text-center text-muted">
										No pending requests
									</div>
								)}
							>
								{pendingRequests.map((req: any) => (
									<Table.Row key={req.id}>
										<Table.Cell className="font-semibold">
											{req.teamName}
										</Table.Cell>
										<Table.Cell>
											<code>{req.userGroup}</code>
										</Table.Cell>
										<Table.Cell className="text-muted text-xs">
											{req.requestedBy}
										</Table.Cell>
										<Table.Cell>
											<div className="flex gap-2">
												<Button
													size="sm"
													variant="primary"
													className="h-8 px-3 text-xs cursor-pointer"
													onClick={() => openDialog("approve", req)}
												>
													Approve
												</Button>
												<Button
													size="sm"
													variant="danger"
													className="h-8 px-3 text-xs cursor-pointer"
													onClick={() => openDialog("reject", req)}
												>
													Reject
												</Button>
											</div>
										</Table.Cell>
									</Table.Row>
								))}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			</Card>

			<AlertDialog
				isOpen={actionState.isOpen}
				onOpenChange={(open) =>
					setActionState((prev) => ({ ...prev, isOpen: open }))
				}
			>
				<AlertDialog.Backdrop>
					<AlertDialog.Container>
						<AlertDialog.Dialog>
							<AlertDialog.CloseTrigger />
							<AlertDialog.Header>
								<AlertDialog.Icon
									status={actionState.type === "approve" ? "accent" : "danger"}
								/>
								<AlertDialog.Heading>
									{actionState.type === "approve"
										? "Approve Request"
										: "Reject Request"}
								</AlertDialog.Heading>
							</AlertDialog.Header>
							<AlertDialog.Body className="flex flex-col gap-4">
								<p className="text-sm">
									Are you sure you want to{" "}
									<strong
										className={
											actionState.type === "approve"
												? "text-accent"
												: "text-danger"
										}
									>
										{actionState.type}
									</strong>{" "}
									the request for{" "}
									<strong>{actionState.request?.teamName}</strong>?
								</p>
								<Surface className="p-3 rounded-xl border border-border/20 bg-surface/50">
									<TextArea
										placeholder={
											actionState.type === "reject"
												? "Reason for rejection is required..."
												: "Optional notes..."
										}
										value={comment}
										onChange={(e: any) => setComment(e.target.value)}
										className="w-full"
									/>
								</Surface>
							</AlertDialog.Body>
							<AlertDialog.Footer>
								<Button
									variant="tertiary"
									onClick={() =>
										setActionState((prev) => ({ ...prev, isOpen: false }))
									}
									isDisabled={isMutating}
								>
									Cancel
								</Button>
								<Button
									variant={
										actionState.type === "approve" ? "primary" : "danger"
									}
									onClick={confirmAction}
									isPending={isMutating}
									isDisabled={actionState.type === "reject" && !comment.trim()}
								>
									Confirm
								</Button>
							</AlertDialog.Footer>
						</AlertDialog.Dialog>
					</AlertDialog.Container>
				</AlertDialog.Backdrop>
			</AlertDialog>
		</div>
	);
}
