#!/usr/bin/env python3
"""
Unit tests for packet_generator.py module
Tests PDF generation, template rendering, and error handling
"""

import unittest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock
import json
import base64

# Import the packet generator module
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi_backend.services.packet_generator import (
    PacketGenerator, 
    PacketData, 
    PacketMetadata,
    generate_packet,
    create_sample_packet
)


class TestPacketGenerator(unittest.TestCase):
    """Test cases for packet generator functionality"""

    def setUp(self):
        """Set up test environment"""
        # Create temporary directories for testing
        self.temp_dir = tempfile.mkdtemp()
        self.template_dir = Path(self.temp_dir) / "templates"
        self.output_dir = Path(self.temp_dir) / "output"
        
        self.template_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create a minimal test template
        self.create_test_template()
        
        # Initialize packet generator with test directories
        self.generator = PacketGenerator(
            template_dir=str(self.template_dir),
            output_dir=str(self.output_dir)
        )
        
        # Sample packet data for testing
        self.sample_data = {
            "narrative_html": "<h2>Test Narrative</h2><p>This is a test narrative for property appeal.</p>",
            "property_data": {
                "address": "123 Test Street, Test City, TS 12345",
                "pin": "12-345-678-90",
                "owner": "Test Owner",
                "property_type": "Commercial",
                "year_built": 2000,
                "square_footage": 5000,
                "current_assessment": 500000,
                "proposed_assessment": 450000
            },
            "flagged_metrics": {
                "noi": 75000,
                "cap_rate": 0.08,
                "expense_ratio": 0.30,
                "vacancy_rate": 0.05,
                "market_value": 450000
            },
            "forms_html": "<div>Test County Form</div>",
            "signature_block_html": "<div>Test Signature Block</div>",
            "firm_name": "Test Tax Consultants",
            "client_name": "Test Client",
            "case_number": "TEST-2024-001"
        }

    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.temp_dir)

    def create_test_template(self):
        """Create a minimal test template"""
        template_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test Template</title>
        </head>
        <body>
            <h1>{{ firm_name }}</h1>
            <h2>{{ property_data.address }}</h2>
            <div>{{ narrative_html | safe }}</div>
            <div>{{ forms_html | safe }}</div>
            <div>{{ signature_block_html | safe }}</div>
            {% if flagged_metrics.noi is defined %}
            <p>NOI: {{ format_currency(flagged_metrics.noi) }}</p>
            {% endif %}
            {% if flagged_metrics.cap_rate is defined %}
            <p>Cap Rate: {{ format_percentage(flagged_metrics.cap_rate * 100) }}</p>
            {% endif %}
        </body>
        </html>
        """
        
        template_path = self.template_dir / "packet_template.html"
        with open(template_path, 'w') as f:
            f.write(template_content)

    def test_packet_data_validation(self):
        """Test PacketData model validation"""
        # Test valid data
        valid_data = PacketData(**self.sample_data)
        self.assertEqual(valid_data.firm_name, "Test Tax Consultants")
        self.assertEqual(valid_data.property_data["address"], "123 Test Street, Test City, TS 12345")
        
        # Test with minimal required data
        minimal_data = {
            "narrative_html": "Test narrative",
            "property_data": {"address": "Test Address"},
            "flagged_metrics": {"noi": 50000}
        }
        minimal_packet = PacketData(**minimal_data)
        self.assertEqual(minimal_packet.narrative_html, "Test narrative")
        self.assertEqual(minimal_packet.attachments, [])  # Default empty list

    def test_basic_packet_generation(self):
        """Test basic packet generation with valid data"""
        result = self.generator.generate_packet(self.sample_data)
        
        # Check successful generation
        self.assertEqual(result["status"], "success")
        self.assertIn("packet_id", result)
        self.assertIn("filepath", result)
        self.assertIn("metadata", result)
        
        # Check file was created
        pdf_path = Path(result["filepath"])
        self.assertTrue(pdf_path.exists())
        self.assertTrue(pdf_path.suffix == ".pdf")
        
        # Check metadata
        metadata = result["metadata"]
        self.assertIn("packet_id", metadata)
        self.assertIn("page_count", metadata)
        self.assertIn("file_size_bytes", metadata)
        self.assertGreater(metadata["file_size_bytes"], 0)

    def test_packet_generation_with_pydantic_model(self):
        """Test packet generation using PacketData model"""
        packet_data = PacketData(**self.sample_data)
        result = self.generator.generate_packet(packet_data)
        
        self.assertEqual(result["status"], "success")
        self.assertIn("packet_id", result)
        
        # Verify file exists and has content
        pdf_path = Path(result["filepath"])
        self.assertTrue(pdf_path.exists())
        self.assertGreater(pdf_path.stat().st_size, 1000)  # Should be reasonable size

    def test_missing_template_error(self):
        """Test error handling when template is missing"""
        # Remove the template file
        template_path = self.template_dir / "packet_template.html"
        template_path.unlink()
        
        result = self.generator.generate_packet(self.sample_data)
        
        self.assertEqual(result["status"], "error")
        self.assertIn("error", result)

    def test_template_rendering_with_missing_data(self):
        """Test template rendering with missing or incomplete data"""
        incomplete_data = {
            "narrative_html": "Test narrative",
            "property_data": {"address": "Test Address"},
            "flagged_metrics": {}  # Empty metrics
        }
        
        result = self.generator.generate_packet(incomplete_data)
        
        # Should still generate successfully with fallbacks
        self.assertEqual(result["status"], "success")
        
        # Check that file was created
        pdf_path = Path(result["filepath"])
        self.assertTrue(pdf_path.exists())

    def test_attachments_processing(self):
        """Test attachment processing functionality"""
        # Create test attachment data
        test_content = b"Test PDF content"
        base64_content = base64.b64encode(test_content).decode('utf-8')
        
        data_with_attachments = self.sample_data.copy()
        data_with_attachments["attachments"] = [
            {
                "filename": "test_attachment.pdf",
                "base64_content": base64_content,
                "description": "Test attachment"
            },
            {
                "filename": "test_file.pdf",
                "filepath": "/nonexistent/path.pdf",  # This should be skipped
                "description": "Non-existent file"
            }
        ]
        
        result = self.generator.generate_packet(data_with_attachments)
        
        # Should generate successfully even with invalid attachment
        self.assertEqual(result["status"], "success")

    def test_currency_formatting(self):
        """Test currency formatting helper function"""
        # Test various currency values
        self.assertEqual(self.generator._format_currency(1000), "$1,000.00")
        self.assertEqual(self.generator._format_currency(1000000), "$1,000,000.00")
        self.assertEqual(self.generator._format_currency("1000"), "$1,000.00")
        self.assertEqual(self.generator._format_currency("$1,000"), "$1,000.00")
        self.assertEqual(self.generator._format_currency("invalid"), "invalid")

    def test_percentage_formatting(self):
        """Test percentage formatting helper function"""
        # Test various percentage values
        self.assertEqual(self.generator._format_percentage(8.5), "8.50%")
        self.assertEqual(self.generator._format_percentage(0.085), "0.09%")
        self.assertEqual(self.generator._format_percentage("8.5"), "8.50%")
        self.assertEqual(self.generator._format_percentage("8.5%"), "8.50%")
        self.assertEqual(self.generator._format_percentage("invalid"), "invalid")

    def test_date_formatting(self):
        """Test date formatting helper function"""
        from datetime import datetime
        
        # Test datetime object
        test_date = datetime(2024, 1, 15)
        self.assertEqual(self.generator._format_date(test_date), "January 15, 2024")
        
        # Test string date
        self.assertEqual(self.generator._format_date("2024-01-15"), "January 15, 2024")
        
        # Test invalid date
        self.assertEqual(self.generator._format_date("invalid"), "invalid")

    def test_html_sanitization(self):
        """Test HTML sanitization in PacketData validation"""
        malicious_data = self.sample_data.copy()
        malicious_data["narrative_html"] = "<script>alert('xss')</script><p>Valid content</p>"
        
        packet_data = PacketData(**malicious_data)
        
        # Script tags should be removed
        self.assertNotIn("<script>", packet_data.narrative_html)
        self.assertIn("<p>Valid content</p>", packet_data.narrative_html)

    def test_convenience_functions(self):
        """Test module-level convenience functions"""
        # Test generate_packet function
        result = generate_packet(self.sample_data)
        self.assertEqual(result["status"], "success")
        
        # Test create_sample_packet function
        sample_result = create_sample_packet()
        self.assertEqual(sample_result["status"], "success")
        self.assertIn("packet_id", sample_result)

    def test_packet_metadata_model(self):
        """Test PacketMetadata model"""
        from datetime import datetime
        
        metadata = PacketMetadata(
            packet_id="test-123",
            filepath="/path/to/test.pdf",
            page_count=5,
            file_size_bytes=12345,
            creation_time=datetime.now(),
            property_address="Test Address",
            client_name="Test Client",
            case_number="TEST-001"
        )
        
        self.assertEqual(metadata.packet_id, "test-123")
        self.assertEqual(metadata.page_count, 5)
        self.assertEqual(metadata.file_size_bytes, 12345)

    def test_error_handling_in_pdf_generation(self):
        """Test error handling during PDF generation"""
        # Create invalid HTML that might cause WeasyPrint issues
        invalid_data = self.sample_data.copy()
        invalid_data["narrative_html"] = "<invalid_html_tag>This is invalid"
        
        result = self.generator.generate_packet(invalid_data)
        
        # Should handle gracefully - WeasyPrint is generally tolerant
        # This test mainly ensures we don't crash on invalid HTML
        self.assertIn("status", result)

    def test_large_packet_generation(self):
        """Test generation of packet with large amounts of data"""
        large_data = self.sample_data.copy()
        
        # Create large narrative
        large_narrative = "<h2>Large Narrative</h2>"
        for i in range(100):
            large_narrative += f"<p>This is paragraph {i+1} of a very long narrative that should result in a multi-page PDF document.</p>"
        
        large_data["narrative_html"] = large_narrative
        
        result = self.generator.generate_packet(large_data)
        
        self.assertEqual(result["status"], "success")
        
        # Check that file is larger due to more content
        pdf_path = Path(result["filepath"])
        self.assertTrue(pdf_path.exists())
        self.assertGreater(pdf_path.stat().st_size, 5000)  # Should be reasonably large

    def test_thread_safety(self):
        """Test that packet generation is thread-safe"""
        import threading
        import time
        
        results = []
        
        def generate_packet_thread(data, index):
            """Thread function to generate a packet"""
            thread_data = data.copy()
            thread_data["case_number"] = f"THREAD-{index}"
            result = self.generator.generate_packet(thread_data)
            results.append(result)
        
        # Create multiple threads
        threads = []
        for i in range(5):
            thread = threading.Thread(target=generate_packet_thread, args=(self.sample_data, i))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check that all packets were generated successfully
        self.assertEqual(len(results), 5)
        for result in results:
            self.assertEqual(result["status"], "success")
            self.assertIn("packet_id", result)

    def test_pdf_content_verification(self):
        """Test that generated PDF contains expected content"""
        result = self.generator.generate_packet(self.sample_data)
        
        self.assertEqual(result["status"], "success")
        
        # Basic verification that PDF file was created with reasonable size
        pdf_path = Path(result["filepath"])
        self.assertTrue(pdf_path.exists())
        self.assertGreater(pdf_path.stat().st_size, 1000)
        
        # Check metadata
        metadata = result["metadata"]
        self.assertGreater(metadata["page_count"], 0)
        self.assertEqual(metadata["property_address"], "123 Test Street, Test City, TS 12345")
        self.assertEqual(metadata["client_name"], "Test Client")

    def test_generate_packet_with_narrative(self):
        """Test packet generation with plain text narrative that gets converted to HTML"""
        data = {
            "narrative": (
                "This property is overassessed based on:\n\n"
                "1. Market declines\n"
                "2. Excess vacancy\n"
                "3. High operating expenses\n\n"
                "We respectfully request a reassessment."
            ),
            "property_data": {
                "address": "1234 Market St",
                "client": "Tax Appeals LLC",
                "jurisdiction": "Cook County, IL"
            },
            "flagged_metrics": {
                "noi": 85000,
                "cap_rate": 0.062,
                "expense_ratio": 0.39
            },
            "forms_html": "<p>Auto-filled appeal form here</p>",
            "signature_block_html": "<p>Signed, Tax Agent</p>",
            "client_name": "Tax Appeals LLC",
            "firm_name": "CHARLY Tax Consultants"
        }

        result = self.generator.generate_packet(data)
        
        # Check successful generation
        self.assertEqual(result["status"], "success")
        self.assertIn("filepath", result)
        self.assertIn("metadata", result)
        
        # Verify file exists and has reasonable size
        pdf_path = Path(result["filepath"])
        self.assertTrue(pdf_path.exists())
        self.assertGreater(pdf_path.stat().st_size, 10000)  # Should be > 10KB
        
        # Check metadata
        metadata = result["metadata"]
        self.assertGreater(metadata["file_size_bytes"], 10000)


if __name__ == '__main__':
    unittest.main()