import React, { useState } from "react";
import { createTable } from "../utils/api";
import { useHistory } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";

function NewTable() {
  const initialFormData = {
    table_name: "",
    capacity: "",
  };

  const [newTable, setNewTable] = useState({ ...initialFormData });
  const [error, setError] = useState(null);
  const history = useHistory();

  function handleChange({ target: { name, value } }) {
    setNewTable({ ...newTable, [name]: value });
    if (newTable.table_name.length >= 1) {
      setError(null);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (newTable.table_name.length <= 1) {
      setError({ message: "Table needs a name with more than one character" });
    } else {
      setError(null);
      createTable(newTable)
        .then(setNewTable({ ...initialFormData }))
        .then(history.push("/dashboard"))
        .catch(setError);
    }
  }

  function handleCancel(event) {
    event.preventDefault();
    history.goBack();
  }
  return (
    <div className='row'>
      <div style={{ margin: "20px 0 0 30px" }}>
        <h1>New Table</h1>
        <ErrorAlert error={error} />
        <div className='col'>
          <form onSubmit={handleSubmit}>
            <div className='row'>
              <div className='col'>
                <label>
                  <h5>Name</h5>
                  <input
                    onChange={handleChange}
                    name='table_name'
                    type='text'
                    value={newTable.table_name}
                    required={true}
                  />
                </label>
              </div>
              <div className='col'>
                <label>
                  <h5>Capacity</h5>
                  <input
                    onChange={handleChange}
                    name='capacity'
                    type='text'
                    value={newTable.capacity}
                    required={true}
                  />
                </label>
              </div>
            </div>

            <button type='submit' className='btn btn-primary'>
              Submit
            </button>
            <button
              type='cancel'
              className='btn btn-warning'
              onClick={handleCancel}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewTable;
