<script lang="ts">
	import {
		CalendarDate,
		type DateValue,
		getLocalTimeZone,
	} from "@internationalized/date";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import { Button } from "$lib/components/ui/button";
	import Calendar from "$lib/components/ui/calendar/calendar.svelte";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Popover from "$lib/components/ui/popover";
	import { cn } from "$lib/shadcn/utils.js";

	let {
		value = $bindable(),
		onChange,
		label,
		disabled = false,
		maxValue,
	}: {
		/** Unix timestamp in seconds */
		value: number | null;
		/** Called when the date/time changes with the new Unix timestamp in seconds */
		onChange?: (timestamp: number) => void;
		/** Optional label above the picker */
		label?: string;
		/** Whether the picker is disabled */
		disabled?: boolean;
		/** Maximum selectable date */
		maxValue?: DateValue;
	} = $props();

	const id = $props.id();

	let open = $state(false);
	let calendarValue = $state<DateValue | undefined>(valueToDateValue(value));
	let timeValue = $state(dateValueToTimeString(value));

	function valueToDateValue(ts: number | null): DateValue | undefined {
		if (!ts) return undefined;
		const date = new Date(ts * 1000);
		return new CalendarDate(
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate(),
		);
	}

	function dateValueToTimeString(ts: number | null): string {
		if (!ts) {
			const now = new Date();
			return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
		}
		const date = new Date(ts * 1000);
		return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
	}

	function combineToTimestamp(dateVal: DateValue | undefined, timeStr: string): number {
		const date = dateVal ? dateVal.toDate(getLocalTimeZone()) : new Date();
		const [hours, minutes, seconds] = timeStr.split(":").map(Number);
		date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
		return Math.floor(date.getTime() / 1000);
	}

	function handleDateChange(newDate: DateValue | undefined) {
		calendarValue = newDate;
		const ts = combineToTimestamp(newDate, timeValue);
		value = ts;
		onChange?.(ts);
		open = false;
	}

	function handleTimeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		timeValue = target.value;
		const ts = combineToTimestamp(calendarValue, timeValue);
		value = ts;
		onChange?.(ts);
	}

	function formatDisplay(ts: number | null): string {
		if (!ts) return "Select date & time";
		return new Date(ts * 1000).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<Label for="{id}-time" class="text-xs text-muted-foreground">{label}</Label>
	{/if}
	<div class="flex gap-2">
		<Popover.Root bind:open>
			<Popover.Trigger id="{id}-date">
				<Button
					variant="outline"
					{disabled}
					class={cn(
						"w-[200px] justify-start text-left font-normal",
						!value && "text-muted-foreground",
					)}
				>
					<CalendarIcon data-icon="inline-start" class="size-3.5" />
					{formatDisplay(value)}
				</Button>
			</Popover.Trigger>
			<Popover.Content class="w-auto overflow-hidden p-0" align="start">
				<Calendar
					type="single"
					bind:value={calendarValue}
					{maxValue}
					captionLayout="dropdown"
					onValueChange={handleDateChange}
				/>
			</Popover.Content>
		</Popover.Root>

		<Input
			type="time"
			id="{id}-time"
			step="1"
			value={timeValue}
			onchange={handleTimeChange}
			{disabled}
			class="bg-background w-[140px] appearance-none font-mono text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
		/>
	</div>
</div>
