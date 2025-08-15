# CHARLY Build Agent (INACTIVE)

> ⚠️ **WARNING**: This agent system is currently INACTIVE and for preparation only. Do not enable in production.

## Overview

The CHARLY Build Agent is a task automation system designed to maintain code quality and enforce project standards. It provides automated checks, reporting, and policy enforcement capabilities.

## Status: INACTIVE

This agent system is scaffolded but intentionally disabled to prevent unintended automation. It requires explicit configuration and activation before use.

## Architecture

```
tools/agent/
├── README.md              # This documentation
├── config.example.json    # Example configuration (copy to config.json)
├── runtime.ts             # Main orchestrator (inactive by default)
├── policies.ts            # Policy definitions and enforcement rules
├── tasks/
│   ├── checkSuite.ts      # Quality gate validation
│   ├── report.ts          # Report generation
│   └── tests/             # Agent task tests
└── logs/                  # Agent execution logs (gitignored)
```

## Configuration

1. Copy `config.example.json` to `config.json`
2. Customize settings for your environment
3. **DO NOT** set `enabled: true` unless you understand the implications

## Available Scripts

- `npm run agent:check` - Run quality checks (safe, read-only)
- `npm run agent:report` - Generate status reports (safe, read-only)
- `npm run agent:runtime` - Start agent runtime (**DANGEROUS - DO NOT RUN**)

## Safety Features

- **Disabled by default**: All automation is inactive without explicit config
- **Read-only mode**: Most operations are informational only
- **Policy enforcement**: "Never push if tests fail" and similar safeguards
- **Logging**: All agent actions are logged for audit
- **Test validation**: Agent tasks must pass tests before activation

## Future Capabilities (When Activated)

- Automated quality gate enforcement
- Continuous integration monitoring
- Code drift detection and alerts
- Automated report generation
- Policy compliance checking

## Security Considerations

**This agent has the potential to:**
- Execute commands on the system
- Make git operations (commits, pushes)
- Modify files and configurations
- Trigger CI/CD pipelines

**Therefore:**
- Only activate after thorough testing
- Review all policies and configurations
- Test in isolated environments first
- Keep detailed audit logs
- Follow principle of least privilege

## Activation Checklist

Before enabling this agent system:

- [ ] All tests pass (`npm run test`)
- [ ] Configuration reviewed and customized
- [ ] Policies align with team requirements
- [ ] Safety measures understood and documented
- [ ] Rollback plan established
- [ ] Team approval obtained

## Support

This is an internal build tool. For issues or questions:
1. Review logs in `tools/agent/logs/`
2. Check test output: `npm run test`
3. Consult team documentation
4. **DO NOT** enable without proper authorization