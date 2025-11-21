import { browser, defineContentScript } from "#imports";
import { z } from "zod";
import {
	getColorSettingsFromStorage,
	colorSettingZodType,
} from "@/modules/color_settings.ts";
import {
	signinMatchPattern,
	getMatches,
	MessageType,
	matchURL,
} from "@/modules/lib.ts";

type GetHTMLElementType = () => HTMLElement | null;

function changeColorElement(
	colorElement: HTMLDivElement,
	colorSetting: z.TypeOf<typeof colorSettingZodType>,
	awsUIRestorePointerEvents: HTMLElement,
) {
	awsUIRestorePointerEvents.style.display = "flex";
	awsUIRestorePointerEvents.style.justifyContent = "space-between";
	colorElement.title = `The color of ${colorSetting.sessionARN}`;
	colorElement.style.backgroundColor = colorSetting.hexColor;
	colorElement.style.width = `${awsUIRestorePointerEvents.clientHeight}px`;
}

async function runChangeSessionsSelectorColor(): Promise<boolean> {
	const colorSettings = await getColorSettingsFromStorage();

	if (colorSettings === null) {
		return false;
	}

	const awsUIRestorePointerEventsList = document.querySelectorAll<HTMLElement>(
		"div[class^='awsui_restore-pointer-events']",
	);

	if (awsUIRestorePointerEventsList.length === 0) {
		return false;
	}

	for (const awsUIRestorePointerEvents of awsUIRestorePointerEventsList) {
		const awsAccountTextContent = ["span", "a"]
			.flatMap((t) => {
				return Array.from(awsUIRestorePointerEvents.getElementsByTagName(t));
			})
			.map(({ textContent }) => textContent)
			.find((textContent) => textContent !== null);

		if (awsAccountTextContent === undefined) {
			continue;
		}

		const sessionCardSessionCardUsername =
			awsUIRestorePointerEvents.querySelector(
				"p[class^='session-card_session_card_username']",
			);

		if (sessionCardSessionCardUsername === null) {
			continue;
		}

		const sessionCardSessionCardUsernameText =
			sessionCardSessionCardUsername.textContent;

		if (sessionCardSessionCardUsernameText === null) {
			continue;
		}

		const colorSetting = colorSettings.find(({ sessionARN }) => {
			const awsAccountID = awsAccountTextContent
				.replaceAll("-", "")
				.replace("(", "")
				.replace(")", "");
			return (
				sessionARN.includes(`:${awsAccountID}:`) &&
				sessionARN.endsWith(`/${sessionCardSessionCardUsernameText.trim()}`)
			);
		});
		const colorElementClassName = "aws-console-colorize-color-element";
		const colorElement = awsUIRestorePointerEvents
			.getElementsByClassName(colorElementClassName)
			.item(0);

		if (colorElement instanceof HTMLDivElement) {
			if (colorSetting === undefined) {
				colorElement.remove();
				continue;
			}

			changeColorElement(colorElement, colorSetting, awsUIRestorePointerEvents);
			continue;
		}

		if (colorSetting === undefined) {
			continue;
		}

		const newColorElement = document.createElement("div");
		newColorElement.className = colorElementClassName;
		changeColorElement(
			newColorElement,
			colorSetting,
			awsUIRestorePointerEvents,
		);
		awsUIRestorePointerEvents.appendChild(newColorElement);
	}

	return true;
}

async function changeSessionsSelectorColor() {
	if (await runChangeSessionsSelectorColor()) {
		return;
	}

	const mutationObserveTargetID = "__next";
	const mutationObserveTarget = document.getElementById(
		mutationObserveTargetID,
	);

	if (mutationObserveTarget === null) {
		throw new Error(`Can't get ${mutationObserveTargetID}`);
	}

	new MutationObserver(async (_, observer) => {
		if (await runChangeSessionsSelectorColor()) {
			observer.disconnect();
		}
	}).observe(mutationObserveTarget, { childList: true, subtree: true });
}

function onSessionsSelectorMessage(message: MessageType) {
	switch (message) {
		case MessageType.getSessionARN:
			return;
		case MessageType.changeColor:
			changeSessionsSelectorColor();
			return;
		default:
			throw new Error(`Incorrect message ${message}`);
	}
}

function runChangeConsoleBackgroundColor(
	color: string,
	getElement: GetHTMLElementType,
): boolean {
	const element = getElement();

	if (element === null) {
		return false;
	}

	element.style.backgroundColor = color;
	return true;
}

async function changeConsoleColor(sessionARN: string) {
	const colorSettings = await getColorSettingsFromStorage();
	const colorSetting = colorSettings?.find((c) => {
		return c.sessionARN === sessionARN;
	});
	const hexColor = colorSetting?.hexColor ?? "";
	const mutationObserverConfigs: {
		getElement: GetHTMLElementType;
		mutationObserveTargetID: string;
	}[] = [
		{
			getElement: () => {
				return document.querySelector(
					"#consoleNavHeader #awsc-nav-header > nav",
				);
			},
			mutationObserveTargetID: "consoleNavHeader",
		},
		{
			getElement: () => document.getElementById("console-nav-footer-inner"),
			mutationObserveTargetID: "console-nav-footer",
		},
	];

	for (const c of mutationObserverConfigs) {
		if (runChangeConsoleBackgroundColor(hexColor, c.getElement)) {
			continue;
		}

		const mutationObserveTarget = document.getElementById(
			c.mutationObserveTargetID,
		);

		if (mutationObserveTarget === null) {
			throw new Error(`Can't get ${c.mutationObserveTargetID}`);
		}

		new MutationObserver((_, observer) => {
			if (runChangeConsoleBackgroundColor(hexColor, c.getElement)) {
				observer.disconnect();
			}
		}).observe(mutationObserveTarget, { childList: true });
	}
}

function onConsoleMessage(
	sessionARN: string,
	message: MessageType,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sendResponse: (response?: any) => void,
) {
	switch (message) {
		case MessageType.getSessionARN:
			sendResponse(sessionARN);
			return true;
		case MessageType.changeColor:
			changeConsoleColor(sessionARN);
			return;
		default:
			throw new Error(`Incorrect message ${message}`);
	}
}

async function main() {
	const isSessionsSelectorTestHTMLURL =
		document.documentURI.startsWith("file://") &&
		document.documentURI.endsWith("tests/e2e/html/sessions/selector.html");

	if (
		matchURL(signinMatchPattern, document.documentURI) ||
		isSessionsSelectorTestHTMLURL
	) {
		if (
			!document.documentURI.includes(
				".signin.aws.amazon.com/sessions/selector",
			) &&
			!isSessionsSelectorTestHTMLURL
		) {
			return;
		}

		browser.runtime.onMessage.addListener((message) =>
			onSessionsSelectorMessage(
				MessageType[message as keyof typeof MessageType],
			),
		);
		await changeSessionsSelectorColor();
		return;
	}

	const awscSessionData = document.querySelector(
		'meta[name="awsc-session-data"]',
	);

	if (!(awscSessionData instanceof HTMLMetaElement)) {
		throw new Error("Can't get awsc-session-data");
	}

	const sessionARN = z
		.object({ sessionARN: z.string() })
		.parse(JSON.parse(awscSessionData.content)).sessionARN;
	browser.runtime.onMessage.addListener(
		(
			message,
			_,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			sendResponse: (response?: any) => void,
		) =>
			onConsoleMessage(
				sessionARN,
				MessageType[message as keyof typeof MessageType],
				sendResponse,
			),
	);
	await changeConsoleColor(sessionARN);
}

export default defineContentScript({ matches: getMatches(), main });
