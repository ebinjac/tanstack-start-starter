import {
	Button,
	Description,
	FieldError,
	Fieldset,
	Form,
	Input,
	Label,
	Separator,
	Surface,
	TextField,
} from "@heroui/react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { checkTeamNameFn, createTeamRequestFn } from "@/actions/teams.fn";

export const Route = createFileRoute("/teams/create")({
	beforeLoad: ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { session } = Route.useRouteContext();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Controlled States for Prefill and validation
	const [teamName, setTeamName] = useState("");
	const [userGroup, setUserGroup] = useState("");
	const [adminGroup, setAdminGroup] = useState("");
	const [contactName, setContactName] = useState("");
	const [contactEmail, setContactEmail] = useState("");

	// Availability triggers
	const [isCheckingName, setIsCheckingName] = useState(false);
	const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);

	// Initialize Prefill from session securely
	useEffect(() => {
		if (session) {
			if (session.fullName) setContactName(session.fullName);
			if (session.email) setContactEmail(session.email);
		}
	}, [session]);

	// Debounce Team Name Check
	useEffect(() => {
		if (teamName.trim().length < 3) {
			setIsNameAvailable(null);
			return;
		}

		setIsCheckingName(true);
		const timer = setTimeout(async () => {
			try {
				const res = await checkTeamNameFn({ data: teamName });
				setIsNameAvailable(res.isAvailable);
			} catch (err) {
				setIsNameAvailable(false);
			} finally {
				setIsCheckingName(false);
			}
		}, 600);

		return () => clearTimeout(timer);
	}, [teamName]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (isNameAvailable === false) {
			return;
		}

		if (!userGroup.startsWith("PRC-") || !adminGroup.startsWith("PRC-")) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const res = await createTeamRequestFn({
				data: {
					teamName,
					userGroup,
					adminGroup,
					contactName,
					contactEmail,
				},
			});
			// Success redirect to request status page
			navigate({ to: "/teams/requests/$requestId", params: { requestId: res.requestId } });
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to submit request.";
			setError(errorMessage);
			setLoading(false);
		}
	};

	return (
		<div className="max-w-xl mx-auto px-4 py-12 flex flex-col gap-6">
			<div>
				<Button
					variant="outline"
					className="p-1 px-2 text-muted hover:text-foreground text-sm flex items-center gap-1 cursor-pointer"
					onPress={() => navigate({ to: "/profile" })}
				>
					<ArrowLeft className="size-4" /> Back to Profile
				</Button>
			</div>

			<div className="flex items-center justify-center rounded-3xl p-1 w-full">
				<Surface className="w-full p-6 backdrop-blur-md rounded-2xl border border-border/50">
					{error && (
						<div className="p-3 mb-4 rounded-md bg-danger/10 text-danger text-sm border border-danger/20">
							{error}
						</div>
					)}
					<Form onSubmit={handleSubmit} className="w-full">
						<Fieldset className="w-full">
							<Fieldset.Legend className="text-2xl font-black tracking-tight text-foreground">
								Register New Team
							</Fieldset.Legend>
							<Description className="text-muted text-sm -mt-1 mb-4">
								Submit a request to create a new team dashboard.
							</Description>

							<Fieldset.Group className="w-full flex flex-col gap-5">
								<TextField
									isRequired
									name="teamName"
									value={teamName}
									onChange={setTeamName}
									validate={(value) => {
										if (value.trim().length < 3) return "Name must be at least 3 characters";
										if (isNameAvailable === false) return "Team Name already taken";
										return null;
									}}
								>
									<Label className="text-sm font-semibold">Team Name</Label>
									<Input
										placeholder="e.g. Enterprise Frameworks"
										autoComplete="off"
										variant="secondary"
									/>
									<Description className="text-xs text-muted flex items-center gap-1 mt-1">
										{isCheckingName ? (
											<span className="text-accent animate-pulse">Checking availability...</span>
										) : isNameAvailable === true ? (
											<span className="text-success">✔ Name available</span>
										) : isNameAvailable === false ? (
											<span className="text-danger">❌ Name already taken</span>
										) : (
											"Must be unique and descriptive."
										)}
									</Description>
									<FieldError />
								</TextField>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<TextField
										isRequired
										name="userGroup"
										value={userGroup}
										onChange={setUserGroup}
										validate={(value) => {
											if (!value.startsWith("PRC-")) return "Group must start with PRC-";
											return null;
										}}
									>
										<Label className="text-sm font-semibold">User Group</Label>
										<Input placeholder="PRC-SSO-GROUP" variant="secondary" />
										<Description className="text-xs text-muted mt-1">
											Must start with <span className="font-semibold text-accent">PRC-</span>
										</Description>
										<FieldError />
									</TextField>

									<TextField
										isRequired
										name="adminGroup"
										value={adminGroup}
										onChange={setAdminGroup}
										validate={(value) => {
											if (!value.startsWith("PRC-")) return "Group must start with PRC-";
											return null;
										}}
									>
										<Label className="text-sm font-semibold">Admin Group</Label>
										<Input placeholder="PRC-SSO-ADMIN" variant="secondary" />
										<Description className="text-xs text-muted mt-1">
											Must start with <span className="font-semibold text-accent">PRC-</span>
										</Description>
										<FieldError />
									</TextField>
								</div>

								<Separator />

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<TextField
										isRequired
										name="contactName"
										value={contactName}
										onChange={setContactName}
									>
										<Label className="text-sm font-semibold">Contact Name</Label>
										<Input variant="secondary" />
										<FieldError />
									</TextField>

									<TextField
										isRequired
										name="contactEmail"
										value={contactEmail}
										onChange={setContactEmail}
									>
										<Label className="text-sm font-semibold">Contact Email</Label>
										<Input type="email" variant="secondary" />
										<FieldError />
									</TextField>
								</div>
							</Fieldset.Group>

							<Fieldset.Actions className="mt-6">
								<Button
									type="submit"
									variant="primary"
									className="font-semibold w-full cursor-pointer"
									isPending={loading}
									isDisabled={isNameAvailable === false || isCheckingName}
								>
									Submit Creation Request
								</Button>
							</Fieldset.Actions>
						</Fieldset>
					</Form>
				</Surface>
			</div>
		</div>
	);
}
