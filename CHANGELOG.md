### Summary of Changes and Enhancements

1. **Code Structure Refactor**:
   - **Modularization**: Split functionality into separate files for better organization and maintainability, including creating distinct routes for different functionalities.

2. **Configuration Management**:
   - Implemented a `dockerConfig.json` file to manage the configuration of multiple Docker hosts dynamically, allowing for easy updates and customizations.

3. **Logging Integration**:
   - Added a logging mechanism to track requests and errors throughout the application, providing insights into API interactions and error handling.

4. **API Endpoints**:
   - Created several new endpoints:
     - **`/api/hosts/stats`**: Fetches statistics for all available Docker hosts.
     - **`/api/containers`**: Lists all containers for a specified host.
   - Expanded the functionality of the `/api/containers` endpoint to periodically fetch container stats.

6. **Background Processing**:
   - Implemented a mechanism to fetch container statistics periodically (every five minutes) in the background, ensuring the main functionality of the application remains responsive.
