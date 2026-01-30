// app/common/services/userHelperService.js
angular.module('common').factory('userHelperService', ['$injector', 'authenticationService', function($injector, authenticationService) {
    var userService = $injector.get('userService'); // Assume these are available
    // ... other services if needed ...

    /**
     * Retrieves the primary user DataSource or an alternative if the primary is not defined.
     *
     * @param {object} user - The user object containing data for different data sources.
     * @param {Array<string>} dataSources - An array of all available DataSources.
     * @returns {string|null} The identifier of the primary or alternative DataSource, or null if none is found.
     */
    var getDataSourceForUser = function getDataSourceForUser(user, dataSources) {
        // Attempt to get the primary DataSource for the logged-in user.
        // Ensure any services it directly uses (like authenticationService) are accessible.
        // If it directly uses $injector, you might need to pass it or inject it properly.
        // For simplicity here, assuming authenticationService is available in the factory scope.
        var dataSource = authenticationService.getDataSource();

        // If the primary DataSource is not defined for the current user,
        // search for an alternative DataSource that does have user information.
        if (user[dataSource] === undefined) {
            /**
             * Helper function to find an alternative DataSource that has user information.
             * @param {Array<string>} availableDataSources - All available DataSources to check.
             * @returns {string|null} The identifier of the first DataSource found with user attributes, or null.
             */
            var getDataSourceAlternate = function(availableDataSources) {
                var alternateDataSource = null;
                // Iterate over all available DataSources to find one with user information.
                for (var i = 0; i < availableDataSources.length; i++) {
                    var ds = availableDataSources[i];
                    // Check if the user has attributes defined for this DataSource.
                    if (user[ds] !== undefined && user[ds].attributes) {
                        alternateDataSource = ds; // Assign the found DataSource.
                        break; // Exit the loop once an alternative DataSource is found.
                    }
                }
                return alternateDataSource; // Return the found alternative DataSource.
            };
            // Call the helper function to get the alternative DataSource.
            dataSource = getDataSourceAlternate(dataSources);
        }

        // Return the found DataSource (primary or alternative).
        // If none was found, it might return undefined or null depending on the prior flow.
        return dataSource;
    };

    return {
        getDataSourceForUser: getDataSourceForUser
    };
}]);