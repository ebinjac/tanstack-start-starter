export const EnsembleLogo = ({
	className = "w-10 h-10 text-accent dark:text-accent",
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			className={className}
			fill="none"
			aria-label="Ensemble Logo"
		>
			<g fill="currentColor">
				<rect x="20" y="15" width="16" height="70" rx="8" opacity="1" />
				<rect x="42" y="15" width="42" height="16" rx="8" opacity="0.9" />
				<rect x="42" y="42" width="28" height="16" rx="8" opacity="0.7" />
				<rect x="42" y="69" width="42" height="16" rx="8" opacity="0.5" />
			</g>
		</svg>
	);
};

export default EnsembleLogo;
