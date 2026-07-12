/**
 * components/RuleCallout.jsx
 *
 * Red-bordered validation/rule box — design.md §5 "Rule/Validation callout".
 * Used two ways:
 *  1. Static footnote: business-rule reminder at page bottom
 *  2. Live inline validation: ✗ icon + block message when a rule fires
 *
 * Usage:
 *   <RuleCallout>Registration No. must be unique · Retired vehicles hidden from dispatch pool</RuleCallout>
 *   <RuleCallout violation>Vehicle capacity exceeded by 200 kg — dispatch blocked</RuleCallout>
 *   <RuleCallout info>Only available vehicles and drivers appear in dispatch dropdowns</RuleCallout>
 */

export default function RuleCallout({ children, violation = false, info = false }) {
  return (
    <div className={`rule-callout ${info ? 'rule-callout-info' : ''}`}>
      {violation && <span className="rule-callout-icon">✗</span>}
      {!violation && !info && <span className="rule-callout-icon" style={{ marginRight: 4 }}>⚠</span>}
      {children}
    </div>
  );
}
