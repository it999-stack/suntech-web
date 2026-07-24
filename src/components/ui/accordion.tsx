"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

function Accordion<Value = unknown>({ ...props }: AccordionPrimitive.Root.Props<Value>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({ ...props }: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item data-slot="accordion-item" {...props} />
}

function AccordionHeader({ ...props }: AccordionPrimitive.Header.Props) {
  return <AccordionPrimitive.Header data-slot="accordion-header" {...props} />
}

function AccordionTrigger({ ...props }: AccordionPrimitive.Trigger.Props) {
  return <AccordionPrimitive.Trigger data-slot="accordion-trigger" {...props} />
}

function AccordionPanel({ ...props }: AccordionPrimitive.Panel.Props) {
  return <AccordionPrimitive.Panel data-slot="accordion-panel" {...props} />
}

export { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionPanel }
