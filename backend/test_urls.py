#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver

def print_url_patterns(patterns, prefix=''):
    for pattern in patterns:
        if hasattr(pattern, 'url_patterns'):
            print(f"{prefix}URLResolver: {pattern.pattern}")
            print_url_patterns(pattern.url_patterns, prefix + '  ')
        else:
            print(f"{prefix}URLPattern: {pattern.pattern} -> {pattern.name}")

resolver = get_resolver()
print("=" * 80)
print("ALL URL PATTERNS:")
print("=" * 80)
print_url_patterns(resolver.url_patterns)

print("\n" + "=" * 80)
print("FILTERED FOR VISUALIZATION AND INTEGRATION:")
print("=" * 80)

def collect_patterns(patterns, prefix=''):
    result = []
    for pattern in patterns:
        if hasattr(pattern, 'url_patterns'):
            result.extend(collect_patterns(pattern.url_patterns, prefix + str(pattern.pattern)))
        else:
            result.append((prefix + str(pattern.pattern), pattern.name))
    return result

all_patterns = collect_patterns(resolver.url_patterns)

for pattern, name in all_patterns:
    if 'visualization' in pattern.lower() or 'integration' in pattern.lower():
        print(f"{pattern} -> {name}")
