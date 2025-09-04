"""
Azure Blob Storage Handler for IRENO Smart Assistant SOP Documents

This module provides functionality to connect to Azure Blob Storage and retrieve
SOP (Standard Operating Procedure) documents for keyword searching.

Required Installation:
    pip install azure-storage-blob

Usage:
    from azure_blob_handler import AzureBlobManager
    
    manager = AzureBlobManager(connection_string)
    content = manager.get_all_document_content("sop-documents")
"""

import logging
from typing import Optional, Dict, List
import os
from datetime import datetime

try:
    from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
    from azure.core.exceptions import AzureError, ResourceNotFoundError, ServiceRequestError
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False
    logging.warning("Azure Storage Blob library not installed. Install with: pip install azure-storage-blob")


class AzureBlobManager:
    """
    Manages connections and operations with Azure Blob Storage for SOP documents.
    
    This class handles downloading and processing markdown (.md) files from Azure Blob Storage
    containers, specifically designed for IRENO platform SOP document management.
    """
    
    def __init__(self, connection_string: str):
        """
        Initialize the Azure Blob Manager.
        
        Args:
            connection_string (str): Azure Storage Account connection string
            
        Raises:
            ImportError: If azure-storage-blob is not installed
            ValueError: If connection string is invalid
        """
        if not AZURE_AVAILABLE:
            raise ImportError(
                "Azure Storage Blob library is required. Install with: pip install azure-storage-blob"
            )
        
        if not connection_string or not connection_string.strip():
            raise ValueError("Connection string cannot be empty")
        
        self.connection_string = connection_string
        self.blob_service_client = None
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """
        Initialize the Azure Blob Service Client.
        
        Raises:
            AzureError: If connection to Azure fails
        """
        try:
            self.blob_service_client = BlobServiceClient.from_connection_string(
                self.connection_string
            )
            self.logger.info("Azure Blob Service Client initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Azure Blob Service Client: {str(e)}")
            raise AzureError(f"Failed to connect to Azure Blob Storage: {str(e)}")
    
    def test_connection(self) -> bool:
        """
        Test the connection to Azure Blob Storage.
        
        Returns:
            bool: True if connection is successful, False otherwise
        """
        try:
            # Try to list containers to test connection
            containers = list(self.blob_service_client.list_containers())
            self.logger.info("Azure Blob Storage connection test successful")
            return True
        except Exception as e:
            self.logger.error(f"Azure Blob Storage connection test failed: {str(e)}")
            return False
    
    def get_all_document_content(self, container_name: str) -> str:
        """
        Download all .md files from the specified container and return their content as a single string.
        
        Args:
            container_name (str): Name of the Azure Blob Storage container
            
        Returns:
            str: Combined content of all .md files in the container
            
        Raises:
            AzureError: If there are issues accessing the container or downloading files
            ResourceNotFoundError: If the container doesn't exist
        """
        if not container_name or not container_name.strip():
            raise ValueError("Container name cannot be empty")
        
        try:
            container_client = self.blob_service_client.get_container_client(container_name)
            
            # Check if container exists
            if not container_client.exists():
                raise ResourceNotFoundError(f"Container '{container_name}' does not exist")
            
            combined_content = []
            md_files_found = 0
            
            self.logger.info(f"Starting to download .md files from container: {container_name}")
            
            # List all blobs in the container
            blob_list = container_client.list_blobs()
            
            for blob in blob_list:
                # Only process .md files
                if blob.name.lower().endswith('.md'):
                    try:
                        md_files_found += 1
                        self.logger.info(f"Processing file: {blob.name}")
                        
                        # Download blob content
                        blob_client = container_client.get_blob_client(blob.name)
                        content = blob_client.download_blob().readall().decode('utf-8')
                        
                        # Add file header and content
                        file_header = f"\n\n=== FILE: {blob.name} ===\n"
                        file_footer = f"\n=== END OF {blob.name} ===\n"
                        
                        combined_content.append(file_header)
                        combined_content.append(content)
                        combined_content.append(file_footer)
                        
                        self.logger.info(f"Successfully processed {blob.name} ({len(content)} characters)")
                        
                    except Exception as e:
                        self.logger.error(f"Failed to download blob {blob.name}: {str(e)}")
                        # Continue with other files instead of failing completely
                        continue
            
            if md_files_found == 0:
                self.logger.warning(f"No .md files found in container '{container_name}'")
                return ""
            
            result = ''.join(combined_content)
            self.logger.info(f"Successfully processed {md_files_found} .md files, total content: {len(result)} characters")
            
            return result
            
        except ResourceNotFoundError:
            self.logger.error(f"Container '{container_name}' not found")
            raise
        except ServiceRequestError as e:
            self.logger.error(f"Service request error: {str(e)}")
            raise AzureError(f"Failed to access Azure Blob Storage: {str(e)}")
        except Exception as e:
            self.logger.error(f"Unexpected error while downloading documents: {str(e)}")
            raise AzureError(f"Failed to download documents from container '{container_name}': {str(e)}")
    
    def list_containers(self) -> List[str]:
        """
        List all containers in the storage account.
        
        Returns:
            List[str]: List of container names
            
        Raises:
            AzureError: If there are issues accessing the storage account
        """
        try:
            containers = []
            for container in self.blob_service_client.list_containers():
                containers.append(container.name)
            
            self.logger.info(f"Found {len(containers)} containers")
            return containers
            
        except Exception as e:
            self.logger.error(f"Failed to list containers: {str(e)}")
            raise AzureError(f"Failed to list containers: {str(e)}")
    
    def list_md_files(self, container_name: str) -> List[Dict[str, any]]:
        """
        List all .md files in the specified container with their metadata.
        
        Args:
            container_name (str): Name of the Azure Blob Storage container
            
        Returns:
            List[Dict]: List of dictionaries containing file information
            
        Raises:
            AzureError: If there are issues accessing the container
        """
        if not container_name or not container_name.strip():
            raise ValueError("Container name cannot be empty")
        
        try:
            container_client = self.blob_service_client.get_container_client(container_name)
            
            if not container_client.exists():
                raise ResourceNotFoundError(f"Container '{container_name}' does not exist")
            
            md_files = []
            blob_list = container_client.list_blobs()
            
            for blob in blob_list:
                if blob.name.lower().endswith('.md'):
                    file_info = {
                        'name': blob.name,
                        'size': blob.size,
                        'last_modified': blob.last_modified,
                        'content_type': blob.content_settings.content_type if blob.content_settings else None
                    }
                    md_files.append(file_info)
            
            self.logger.info(f"Found {len(md_files)} .md files in container '{container_name}'")
            return md_files
            
        except ResourceNotFoundError:
            self.logger.error(f"Container '{container_name}' not found")
            raise
        except Exception as e:
            self.logger.error(f"Failed to list .md files in container '{container_name}': {str(e)}")
            raise AzureError(f"Failed to list .md files: {str(e)}")
    
    def get_document_by_name(self, container_name: str, document_name: str) -> str:
        """
        Download a specific document by name from the container.
        
        Args:
            container_name (str): Name of the Azure Blob Storage container
            document_name (str): Name of the specific document to download
            
        Returns:
            str: Content of the requested document
            
        Raises:
            AzureError: If there are issues accessing the container or file
            ResourceNotFoundError: If the container or file doesn't exist
        """
        if not container_name or not container_name.strip():
            raise ValueError("Container name cannot be empty")
        
        if not document_name or not document_name.strip():
            raise ValueError("Document name cannot be empty")
        
        try:
            container_client = self.blob_service_client.get_container_client(container_name)
            
            if not container_client.exists():
                raise ResourceNotFoundError(f"Container '{container_name}' does not exist")
            
            blob_client = container_client.get_blob_client(document_name)
            
            if not blob_client.exists():
                raise ResourceNotFoundError(f"Document '{document_name}' does not exist in container '{container_name}'")
            
            content = blob_client.download_blob().readall().decode('utf-8')
            
            self.logger.info(f"Successfully downloaded document '{document_name}' ({len(content)} characters)")
            return content
            
        except ResourceNotFoundError:
            self.logger.error(f"Resource not found: {document_name} in {container_name}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to download document '{document_name}': {str(e)}")
            raise AzureError(f"Failed to download document '{document_name}': {str(e)}")


# Utility function for easy initialization
def create_azure_blob_manager(connection_string: Optional[str] = None) -> AzureBlobManager:
    """
    Create an AzureBlobManager instance with connection string from environment or parameter.
    
    Args:
        connection_string (Optional[str]): Azure Storage connection string. 
                                         If None, will try to get from AZURE_STORAGE_CONNECTION_STRING env var
    
    Returns:
        AzureBlobManager: Initialized Azure Blob Manager instance
        
    Raises:
        ValueError: If no connection string is provided or found in environment
        AzureError: If connection to Azure fails
    """
    if connection_string is None:
        connection_string = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
    
    if not connection_string:
        raise ValueError(
            "Azure Storage connection string is required. "
            "Provide it as parameter or set AZURE_STORAGE_CONNECTION_STRING environment variable"
        )
    
    return AzureBlobManager(connection_string)


# Example usage and testing
if __name__ == "__main__":
    # Example usage (for testing purposes)
    import sys
    
    # Setup basic logging for testing
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        # Try to create manager from environment variable
        manager = create_azure_blob_manager()
        
        print("Testing Azure Blob Storage connection...")
        if manager.test_connection():
            print(" Connection successful!")
            
            # List containers
            containers = manager.list_containers()
            print(f"Found containers: {containers}")
            
            # If there are containers, try to list .md files in the first one
            if containers:
                first_container = containers[0]
                print(f"\n Listing .md files in container '{first_container}':")
                md_files = manager.list_md_files(first_container)
                for file_info in md_files:
                    print(f"  - {file_info['name']} ({file_info['size']} bytes)")
        else:
            print(" Connection failed!")
            
    except Exception as e:
        print(f"Error: {str(e)}")
        print("\nMake sure to:")
        print("1. Install azure-storage-blob: pip install azure-storage-blob")
        print("2. Set AZURE_STORAGE_CONNECTION_STRING environment variable")
        sys.exit(1)
