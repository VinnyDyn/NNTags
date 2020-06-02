# NNTags

An easy way to view, associate and disassociate records.

![alt text](https://github.com/VinnyDyn/NNTags/blob/master/Images/pcf_nn_tags.gif)

After install the solution, add a many-to-many sub-grid in a form.

### DataSource
- Records: **All Record Types**, required use this option.
- Entity: **Only Many-to-Many Relationhips**.
> The layout, filters and order will be defined by Default View parameter.

![alt text](https://github.com/VinnyDyn/NNTags/blob/master/Images/pcf_configuration_data_source.png)

### Row Layout
The quantity of records is directly associated to parameter **Number of Rows**.
> This component isn't indicated to many-to-many relationships with many records!

![alt text](https://github.com/VinnyDyn/NNTags/blob/master/Images/pcf_configuration_layout.png)

### Controls
Add the component EasyM2M for relationships, here we need include two parameters.
- Many-to-Many Relationship: Many-to-Many LogicalName.
- Associated Hexadecimal: define a button color when the record are related.

![alt text](https://github.com/VinnyDyn/NNTags/blob/master/Images/pcf_configuration.png)

### Developers
After clone the repository, execute the command "npm install" to restore all packages.
