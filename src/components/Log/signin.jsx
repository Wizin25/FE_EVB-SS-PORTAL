import { Link } from 'react-router-dom'

function signin(){
    return(
        <div className="signin-page">

        <div className="signin-container">
            <h1>Sign In Page</h1>
            <form>
                <input type="text" placeholder="Username" required /><br/>
                <input type="password" placeholder="Password" required  /><br/>
                <input type="submit" value="Sign In" />
            </form>
            <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
        
        </div>
    );
}

export default signin;